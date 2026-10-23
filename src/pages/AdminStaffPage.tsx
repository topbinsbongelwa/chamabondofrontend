import { StaffDirectory } from '../components/admin/StaffDirectory'
import { StaffStats } from '../components/admin/StaffStats'
import { useStaffDirectory } from '../hooks/useStaffDirectory'
import { getRoleLabel } from '../lib/roles'

export function AdminStaffPage() {
  const { staff, loading, error, reload } = useStaffDirectory()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Staff management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Staff directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Search staff and review their profile, attendance and monthly records.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold-700">
          {getRoleLabel()}
        </span>
      </div>

      <StaffStats staff={staff} loading={loading} error={error} />

      <StaffDirectory
        staff={staff}
        loading={loading}
        error={error}
        onRetry={reload}
      />
    </div>
  )
}
