#!/usr/bin/perl

use warnings;
use strict;
use v5.10;

use JSON;
use LWP::Simple qw(get);
use Data::Dumper;


my  $PATH = "/home/norbert/openui5-dist/";

sub relVersionsSource {
	my $url = "http://openui5.org/OpenUI5Downloads.json";
	return JSON->new->utf8->decode(get $url);
}

sub isBeta {
	my $version = shift;
	my $relVersionsSource = shift;
	my @exists = grep {
		$version eq $_->{"version"} && $_->{"beta"} && $_->{"beta"} eq "true"
	} @$relVersionsSource;
	return scalar(@exists);
}

sub latestVersion {
	my $relVersions = shift;
	my $relVersionsSource = shift;
	my @sorted =
		reverse
		grep {
			! isBeta(join(".", @$_), $relVersionsSource)
		}
		sort {
			$a->[0] <=> $b->[0]
			|| $a->[1] <=> $b->[1]
			|| $a->[2] <=> $b->[2]
		} @$relVersions;

	return join(".", @{$sorted[0]});
}

sub relVersions {
	my @relVersions = map { $_->{version} } @{$_[0]};
	return [
		map {
			$_ =~ /(\d+)\.(\d+)\.(\d+)/;
			[$1 + 0, $2 + 0, $3 + 0];
		} @relVersions
	];
}

sub npmVersions {
	my $json = `npm show openui5-dist versions --json 2>&1`;
	my $npmVersions = JSON->new->utf8->decode($json);
	my $npmVersionsGrouped = {};

	foreach (@$npmVersions) {
		my $major;
		my $minor;
		my $patch;
		if ($_ =~ /(\d+)\.(\d+)\.(\d+)/) {
			$major = $1;
			$minor = $2;
			$patch = $3 + 0;
			if ( ! $npmVersionsGrouped->{"$major.$minor"} ) {
				$npmVersionsGrouped->{"$major.$minor"} = $patch;
			} elsif ( $npmVersionsGrouped->{"$major.$minor"} < $patch ) {
				$npmVersionsGrouped->{"$major.$minor"} = $patch;
			}
		}

	}

	return [
		map {
			$_ =~ /(\d+)\.(\d+)/;
			[$1 + 0, $2 + 0, $npmVersionsGrouped->{$_}];
		} keys(%$npmVersionsGrouped)
	];
}


sub findNewReleases {
	my $relVersions = shift;
	my $npmVersions = shift;
	my $relVersionsSource = shift;
	my $latestVersion = shift;

	my $compareVersions = {};
	my $foundNpmVersion;

	foreach my $rel (@$relVersions) {
		my $key = "$rel->[0].$rel->[1]";
		$compareVersions->{$key} = {
			"rel" => $rel
		};

		foreach my $npm (@$npmVersions) {
			if ("$npm->[0].$npm->[1]" eq $key) {
				$compareVersions->{$key}->{"npm"} = $npm;
			}
		};
	}


	return [
		sort {
			$a->{major} <=> $b->{major}
			|| $a->{minor} <=> $b->{minor}
			|| $a->{patch} <=> $b->{patch}
		}
		map {
			my $version = join(".", @{$compareVersions->{$_}->{"rel"}});
			{
				version => $version,
				major => $compareVersions->{$_}->{"rel"}->[0],
				minor => $compareVersions->{$_}->{"rel"}->[1],
				patch => $compareVersions->{$_}->{"rel"}->[2],
				isBeta($version, $relVersionsSource) ? (beta => 1) : (),
				$latestVersion eq $version ? (latest => 1) : ()
			}
		}
		grep { ! exists($compareVersions->{$_}->{"npm"}) ||
			$compareVersions->{$_}->{"npm"}->[2] < $compareVersions->{$_}->{"rel"}->[2]
		}
		keys(%$compareVersions)
	];
}

sub readPackageJson {
	my $packageFileName = shift;
	my $json_text = do {
		open(my $fh, "<:encoding(UTF-8)", $packageFileName) or
		die("Can't open \$filename\": $!\n");
			local $/;
		<$fh>
	};
	return JSON->new->utf8->decode($json_text);
}

sub writePackageJson {
	my $packageFileName = shift;
	my $packageJSONContent = shift;
	my $jsonText = JSON->new->utf8->pretty(1)->encode($packageJSONContent);

	open (OUT, ">$packageFileName");
	binmode(OUT, ":utf8");
	print OUT $jsonText;
	close OUT;
}


sub updateVersionInPackageFile {
	my $version = shift;
	my $packageJSON = readPackageJson("$PATH/package.json");

	$packageJSON->{version} = $version;

	writePackageJson("$PATH/package.json", $packageJSON);
}


my $relVersionsSource = relVersionsSource();
my $relVersions = relVersions($relVersionsSource);
my $npmVersions = npmVersions();
my $latestVersion = latestVersion ($relVersions, $relVersionsSource);
my $foundVersionsToPublish = findNewReleases($relVersions, $npmVersions, $relVersionsSource, $latestVersion);

chdir $PATH;
foreach (@$foundVersionsToPublish) {
	my $tag = $_->{beta} ? " (beta)" : ($_->{latest} ? " (latest)" : "");
	my $title = "Update OpenUI5 to version $_->{version} $tag";
	say "================================================";
	say join("", "= ", $title, " " x (45 - length($title)), "=");
	say "================================================";
	say "\nRemoving temporary files";
	system "rm -rf /tmp/openui5";
	say "Building OpenUI5";
	updateVersionInPackageFile("$_->{version}");
	system "node index.js";
	say "Publishing  OpenUI5 to NPM repository";
	system "npm publish $PATH " . ($_->{beta} ? " --tag beta" : "");
	if ( ! $_->{beta}) {
		updateVersionInPackageFile("$latestVersion");
		system "npm dist-tag add  openui5-dist\@$latestVersion latest;";
	}
	say "\n";
}
