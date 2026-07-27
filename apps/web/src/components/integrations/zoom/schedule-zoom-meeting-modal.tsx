'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/api-client';
import { zoomService } from '@/services/zoom.service';

const scheduleMeetingSchema = z.object({
  topic: z.string().min(1, 'Meeting topic is required').max(200),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z
    .number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
  password: z
    .string()
    .max(10, 'Passcode cannot exceed 10 characters')
    .optional()
    .or(z.literal('')),
});

type ScheduleMeetingForm = z.infer<typeof scheduleMeetingSchema>;

interface ScheduleZoomMeetingModalProps {
  open: boolean;
  onClose: () => void;
}

function toIsoStartTime(localValue: string): string {
  return new Date(localValue).toISOString();
}

function getDefaultStartTime(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date.toISOString().slice(0, 16);
}

export function ScheduleZoomMeetingModal({
  open,
  onClose,
}: ScheduleZoomMeetingModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleMeetingForm>({
    resolver: zodResolver(scheduleMeetingSchema),
    defaultValues: {
      topic: '',
      startTime: getDefaultStartTime(),
      duration: 30,
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ScheduleMeetingForm) =>
      zoomService.createMeeting({
        topic: values.topic,
        startTime: toIsoStartTime(values.startTime),
        duration: values.duration,
        password: values.password?.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      reset({
        topic: '',
        startTime: getDefaultStartTime(),
        duration: 30,
        password: '',
      });
      onClose();
    },
  });

  const handleClose = () => {
    if (!mutation.isPending) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Schedule New Meeting">
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <FormField label="Meeting Topic" htmlFor="topic" error={errors.topic?.message}>
          <Input
            id="topic"
            placeholder="Weekly team sync"
            {...register('topic')}
          />
        </FormField>

        <FormField
          label="Start Time"
          htmlFor="startTime"
          error={errors.startTime?.message}
        >
          <Input id="startTime" type="datetime-local" {...register('startTime')} />
        </FormField>

        <FormField
          label="Duration (minutes)"
          htmlFor="duration"
          error={errors.duration?.message}
        >
          <Input
            id="duration"
            type="number"
            min={15}
            max={480}
            step={15}
            {...register('duration', { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label="Passcode (optional)"
          htmlFor="password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            placeholder="Leave blank for Zoom-generated passcode"
            {...register('password')}
          />
        </FormField>

        {mutation.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {getErrorMessage(mutation.error)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
