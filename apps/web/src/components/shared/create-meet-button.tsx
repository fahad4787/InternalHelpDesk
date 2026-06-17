'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateMeetModal } from '@/components/shared/create-meet-modal';

interface CreateMeetButtonProps {
  onCreated?: () => void;
  size?: 'sm' | 'default';
}

export function CreateMeetButton({ onCreated, size = 'sm' }: CreateMeetButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Meet
      </Button>
      <CreateMeetModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </>
  );
}
