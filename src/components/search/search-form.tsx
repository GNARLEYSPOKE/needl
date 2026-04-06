'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MatchResultCard } from '@/components/search/match-result-card';
import { searchMembers } from '@/lib/actions/search';
import type { MatchResult } from '@/lib/actions/search';

const COUNTRY_OPTIONS = ['Canada', 'United States', 'United Kingdom', 'Australia'] as const;

export function SearchForm() {
  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch(): void {
    if (query.length < 3) {
      toast.error('Enter at least 3 characters');
      return;
    }

    startTransition(async () => {
      try {
        const result = await searchMembers({ query, countryFilter });
        if (result.error) {
          toast.error(result.error);
          setResults(null);
        } else {
          setResults(result.data ?? []);
        }
        setHasSearched(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        toast.error(message);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you need? Describe in plain language..."
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

      {/* Country filter chips */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={countryFilter === undefined ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setCountryFilter(undefined)}
        >
          All regions
        </Badge>
        {COUNTRY_OPTIONS.map((country) => (
          <Badge
            key={country}
            variant={countryFilter === country ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCountryFilter(countryFilter === country ? undefined : country)}
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
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {!isPending && results && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <MatchResultCard key={result.member_id} result={result} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isPending && hasSearched && results && results.length === 0 && (
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
