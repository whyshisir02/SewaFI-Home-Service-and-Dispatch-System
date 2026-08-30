import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button';

function ProviderDocumentsSection({
  providerProfile,
  status,
  rejectionReason,
  uploading = false,
  resubmitting = false,
  onUpload,
  onResubmit,
}) {
  const [citizenshipFront, setCitizenshipFront] = useState(null);
  const [citizenshipBack, setCitizenshipBack] = useState(null);

  const isRejected = status === 'REJECTED';
  const isApproved = status === 'APPROVED';

  const handleUpload = async () => {
    if (!onUpload) return;

    await onUpload({
      citizenshipFront,
      citizenshipBack,
    });

    setCitizenshipFront(null);
    setCitizenshipBack(null);
  };

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--sf-primary)]">
          Verification
        </p>

        <h2 className="mt-2 text-xl font-extrabold text-[var(--sf-text-main)]">
          Document Verification
        </h2>

        <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
          Upload clear citizenship documents for admin review.
        </p>
      </div>

      {isRejected ? (
        <div className="mt-5 rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
          <p className="text-sm font-bold text-red-300">
            Your application was rejected.
          </p>
          <p className="mt-1 text-sm text-red-100">
            Reason: {rejectionReason || 'No reason was provided.'}
          </p>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
            Please upload corrected documents and resubmit your application.
          </p>
        </div>
      ) : null}

      {providerProfile?.citizenshipFront || providerProfile?.citizenshipBack ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {providerProfile?.citizenshipFront ? (
            <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
              <p className="mb-2 text-sm font-semibold text-[var(--sf-text-main)]">
                Current Citizenship Front
              </p>
              <a href={providerProfile.citizenshipFront} target="_blank" rel="noreferrer">
                <img
                  src={providerProfile.citizenshipFront}
                  alt="Citizenship front"
                  loading="lazy"
                  decoding="async"
                  className="h-40 w-full rounded-xl object-cover"
                />
              </a>
            </div>
          ) : null}

          {providerProfile?.citizenshipBack ? (
            <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
              <p className="mb-2 text-sm font-semibold text-[var(--sf-text-main)]">
                Current Citizenship Back
              </p>
              <a href={providerProfile.citizenshipBack} target="_blank" rel="noreferrer">
                <img
                  src={providerProfile.citizenshipBack}
                  alt="Citizenship back"
                  loading="lazy"
                  decoding="async"
                  className="h-40 w-full rounded-xl object-cover"
                />
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isApproved ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--sf-text-main)]">
              Citizenship Front
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setCitizenshipFront(event.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-3 text-sm text-[var(--sf-text-main)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--sf-text-main)]">
              Citizenship Back
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setCitizenshipBack(event.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-3 text-sm text-[var(--sf-text-main)]"
            />
          </label>
        </div>
      ) : null}

      {!isApproved ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || (!citizenshipFront && !citizenshipBack)}
            className="h-11 rounded-xl"
          >
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </Button>

          {isRejected ? (
            <Button
              type="button"
              variant="outline"
              onClick={onResubmit}
              disabled={resubmitting}
              className="h-11 rounded-xl"
            >
              {resubmitting ? 'Resubmitting...' : 'Resubmit Application'}
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Your provider application is approved. Document changes are disabled from this page.
        </p>
      )}
    </section>
  );
}

export default ProviderDocumentsSection;