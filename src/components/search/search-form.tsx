'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MatchResultCard } from '@/components/search/match-result-card';
import { MemberSearchCard } from '@/components/search/member-search-card';
import { searchMembers, searchByName } from '@/lib/actions/search';
import type { MatchResult, PersonResult } from '@/lib/actions/search';

const COUNTRY_OPTIONS = ['Canada', 'United States', 'United Kingdom', 'Australia'] as const;

interface SearchFormProps {
  senderName: string;
}

export function SearchForm({ senderName }: SearchFormProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | undefined>(undefined);
  const [chapterOnly, setChapterOnly] = useState(false);
  const [serviceResults, setServiceResults] = useState<MatchResult[] | null>(null);
  const [peopleResults, setPeopleResults] = useState<PersonResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch(): void {
    if (query.length < 3) {
      toast.error('Enter at least 3 characters');
      return;
    }

    startTransition(async () => {
      try {
        const [serviceResult, peopleResult] = await Promise.all([
          searchMembers({
            query,
            countryFilter: chapterOnly ? undefined : countryFilter,
            chapterOnly,
          }),
          searchByName(query),
        ]);

        if (serviceResult.error) toast.error(serviceResult.error);
        setServiceResults(serviceResult.data ?? []);
        setPeopleResults(peopleResult.data ?? []);
        setHasSearched(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        toast.error(message);
      }
    });
  }

  const showPeople = peopleResults && peopleResults.length > 0;
  const showServices = serviceResults && serviceResults.length > 0;
  const showEmpty = hasSearched && !showPeople && !showServices;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company, or what you need..."
          className="text-base"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button onClick={handleSearch} disabled={isPending}>
          {isPending ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={!chapterOnly && countryFilter === undefined ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => {
            setCountryFilter(undefined);
            setChapterOnly(false);
          }}
        >
          All regions
        </Badge>
        <Badge
          variant={chapterOnly ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => {
            setChapterOnly(!chapterOnly);
            if (!chapterOnly) setCountryFilter(undefined);
          }}
        >
          My Chapter
        </Badge>
        {COUNTRY_OPTIONS.map((country) => (
          <Badge
            key={country}
            variant={countryFilter === country ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              setCountryFilter(countryFilter === country ? undefined : country);
              setChapterOnly(false);
            }}
          >
            {country}
          </Badge>
        ))}
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* People section */}
      {!isPending && showPeople && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">People</h2>
          <div className="space-y-4">
            {peopleResults!.map((person) => (
              <MemberSearchCard key={person.member_id} person={person} senderName={senderName} />
            ))}
          </div>
        </section>
      )}

      {/* Service Matches section */}
      {!isPending && showServices && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">Service Matches</h2>
          <div className="space-y-4">
            {serviceResults!.map((result) => (
              <MatchResultCard key={result.member_id} result={result} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isPending && showEmpty && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No matches found{countryFilter ? ` in ${countryFilter}` : ''}. Try broadening your
            search.
          </p>
        </div>
      )}
    </div>
  );
}
