'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Video } from 'lucide-react';
import { Modal } from '@/components/shared/modal';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api-client';
import { googleCalendarService } from '@/services/google-calendar.service';
import { showToast } from '@/components/shared/toast';

interface CreateMeetModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function getDefaultStart() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30 - (date.getMinutes() % 30));
  date.setSeconds(0, 0);
  return date;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function CreateMeetModal({ open, onClose, onCreated }: CreateMeetModalProps) {
  const defaultStart = useMemo(() => getDefaultStart(), [open]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => toDateInputValue(defaultStart));
  const [time, setTime] = useState(() => toTimeInputValue(defaultStart));
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const start = getDefaultStart();
    setTitle('');
    setDate(toDateInputValue(start));
    setTime(toTimeInputValue(start));
    setDurationMinutes('30');
    setDescription('');
    setAttendees('');
    setError('');
  }, [open]);

  const resetForm = () => {
    const start = getDefaultStart();
    setTitle('');
    setDate(toDateInputValue(start));
    setTime(toTimeInputValue(start));
    setDurationMinutes('30');
    setDescription('');
    setAttendees('');
    setError('');
  };

  const mutation = useMutation({
    mutationFn: () => {
      const startAt = new Date(`${date}T${time}`);
      if (Number.isNaN(startAt.getTime())) {
        throw new Error('Invalid date or time');
      }

      const attendeeEmails = attendees
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);

      return googleCalendarService.createMeet({
        title: title.trim(),
        startAt: startAt.toISOString(),
        durationMinutes: Number(durationMinutes),
        description: description.trim() || undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        attendeeEmails: attendeeEmails.length > 0 ? attendeeEmails : undefined,
      });
    },
    onSuccess: (res) => {
      showToast('Google Meet created', 'success');
      onCreated?.();
      resetForm();
      onClose();
      if (res.data.meetLink) {
        window.open(res.data.meetLink, '_blank', 'noopener,noreferrer');
      }
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    resetForm();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Google Meet">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          if (!title.trim()) {
            setError('Meeting title is required');
            return;
          }
          mutation.mutate();
        }}
      >
        <FormField label="Title" htmlFor="meet-title">
          <Input
            id="meet-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Team sync"
            disabled={mutation.isPending}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date" htmlFor="meet-date">
            <Input
              id="meet-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={mutation.isPending}
            />
          </FormField>
          <FormField label="Time" htmlFor="meet-time">
            <Input
              id="meet-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={mutation.isPending}
            />
          </FormField>
        </div>

        <FormField label="Duration" htmlFor="meet-duration">
          <Select
            id="meet-duration"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            disabled={mutation.isPending}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
          </Select>
        </FormField>

        <FormField label="Description" htmlFor="meet-description">
          <Textarea
            id="meet-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional agenda or notes"
            className="min-h-[80px] resize-none"
            disabled={mutation.isPending}
          />
        </FormField>

        <FormField label="Invitees" htmlFor="meet-attendees">
          <Input
            id="meet-attendees"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="email1@company.com, email2@company.com"
            disabled={mutation.isPending}
          />
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            <Video className="mr-2 h-4 w-4" />
            {mutation.isPending ? 'Creating...' : 'Create Meet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
