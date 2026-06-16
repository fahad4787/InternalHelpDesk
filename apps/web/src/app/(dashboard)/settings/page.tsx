'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PageContainer } from '@/components/shared/page-container';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { companiesService } from '@/services/companies.service';
import { getErrorMessage } from '@/lib/api-client';
import { useState } from 'react';

interface CompanyForm {
  name: string;
  domain: string;
  description: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => companiesService.getCompany(),
  });

  const company = data?.data;

  const { register, handleSubmit } = useForm<CompanyForm>({
    values: {
      name: company?.name ?? '',
      domain: company?.domain ?? '',
      description: company?.description ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (formData: CompanyForm) => companiesService.updateCompany(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setMessage('Settings saved successfully');
      setError('');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <PageContainer title="Settings" description="Manage your company profile">
      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
              <FormField label="Company Name">
                <Input {...register('name')} />
              </FormField>
              <FormField label="Domain">
                <Input {...register('domain')} placeholder="company.com" />
              </FormField>
              <FormField label="Description">
                <Textarea {...register('description')} />
              </FormField>
              <div className="text-sm text-slate-500">
                Slug: <span className="font-mono">{company?.slug}</span>
              </div>
              {message && <p className="text-sm text-emerald-600">{message}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
