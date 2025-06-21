'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type JobStatus = {
  id: string | null;
  state: string;
  progress: number;
  returnValue: any;
};

export default function TasksPage() {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data: JobStatus[] = await response.json();
      setJobs(data);

      const hasActiveJobs = data.some(
        (job) => job.state === 'active' || job.state === 'waiting'
      );
      if (!hasActiveJobs && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Polling stopped.');
      }
    } catch (error) {
      console.error('Failed to get tasks', error);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const startTask = async () => {
    setLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskType: 'fetch-catalog', bookId: '8' }),
      });
      await fetchJobs();
      if (!intervalRef.current) {
        console.log('Polling started.');
        startPolling();
      }
    } catch (error) {
      console.error('Failed to start task', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchJobs, 2000);
  };

  useEffect(() => {
    fetchJobs();
    startPolling();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Background Tasks</h1>
      <Card>
        <CardHeader>
          <CardTitle>Job Runner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={startTask} disabled={loading}>
            {loading ? 'Starting Task...' : 'Start New Task'}
          </Button>

          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle>Job Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Job ID:</strong> {job.id}
                    </p>
                    <p>
                      <strong>State:</strong> {job.state}
                    </p>
                    <div className="mt-2">
                      <Progress value={job.progress} />
                      <p className="text-sm text-center mt-1">
                        {job.progress}%
                      </p>
                    </div>
                    {job.state === 'completed' && (
                      <p className="text-green-600 mt-2">
                        <strong>Result:</strong>{' '}
                        {JSON.stringify(job.returnValue)}
                      </p>
                    )}
                    {job.state === 'failed' && (
                      <p className="text-red-600 mt-2">
                        <strong>Job Failed</strong>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <p>No active tasks.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 