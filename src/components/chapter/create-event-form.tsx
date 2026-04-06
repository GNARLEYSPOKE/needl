'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createEvent } from '@/lib/actions/event';

interface CreateEventFormProps {
  chapterId: string;
}

export function CreateEventForm({ chapterId }: CreateEventFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<'in_person' | 'virtual' | 'hybrid'>('in_person');
  const [location, setLocation] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(): void {
    startTransition(async () => {
      try {
        const result = await createEvent({
          chapterId,
          title,
          format,
          location: location || undefined,
          scheduledAt,
          durationMinutes: 90,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Event created!');
        router.push('/chapter/visitors');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create event');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New Meeting Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Weekly Chapter Meeting"
          />
        </div>
        <div>
          <Label htmlFor="format">Format</Label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'in_person' | 'virtual' | 'hybrid')}
            className="border-input bg-background mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="in_person">In Person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Address or video link"
          />
        </div>
        <div>
          <Label htmlFor="scheduled">Date & Time</Label>
          <Input
            id="scheduled"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !title || !scheduledAt}
          className="w-full"
        >
          {isPending ? 'Creating...' : 'Create Event'}
        </Button>
      </CardContent>
    </Card>
  );
}
