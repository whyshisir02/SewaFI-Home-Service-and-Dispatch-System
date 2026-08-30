import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { Textarea } from '../../../../components/ui/Input/Textarea';

export function SupportReplyBox({ onSubmit, loading, disabled }) {
  const [value, setValue] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = value.trim();
    if (!message) return;
    await onSubmit(message);
    setValue('');
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Textarea
        label="Reply"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Write a helpful reply..."
        disabled={loading || disabled}
      />
      <Button
        type="submit"
        className="h-10 rounded-xl bg-[var(--sf-secondary)] text-white hover:brightness-95"
        loading={loading}
        disabled={loading || disabled || !value.trim()}
      >
        {loading ? 'Sending...' : 'Send Reply'}
      </Button>
    </form>
  );
}

export default SupportReplyBox;

