import { useEffect, useState } from 'react';
import { joinGroup } from '../lib/db';
import { go } from '../lib/router';
import { Button, ErrorBox, Spinner, useToast } from '../components/ui';

export function Join({ code }: { code: string }) {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    // join_group è idempotente: se React lo esegue due volte non crea doppioni.
    joinGroup(code)
      .then((id) => { toast('Sei dentro! 🌴'); go(`/g/${id}`); })
      .catch((e: Error) => setError(e.message));
  }, [code, toast]);

  if (!error) return <Spinner />;
  return (
    <div className="stack">
      <ErrorBox message={error} />
      <Button variant="ghost" onClick={() => go('/')}>Torna ai tuoi gruppi</Button>
    </div>
  );
}
