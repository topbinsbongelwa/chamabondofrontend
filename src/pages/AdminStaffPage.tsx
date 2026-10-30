import { useMemo } from 'react'
import { StaffDirectory } from '../components/admin/StaffDirectory'
import { StaffStats } from '../components/admin/StaffStats'
import { useStaffDirectory } from '../hooks/useStaffDirectory'
import { getDepartmentScope, getRoleLabel } from '../lib/roles'

export function AdminStaffPage() {
  const { staff, loading, error, reload } = useStaffDirectory()
  const department = getDepartmentScope()
  const scopedStaff = useMemo(
    () =>
      staff.filter((member) =>
        department === null
          ? true
          : Boolean(
              department &&
                member.department?.trim().toLowerCase() ===
                  department.toLowerCase(),
            ),
      ),
    [department, staff],
  )

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
          {department !== null
            ? department
              ? `${department} department`
              : 'Department not assigned'
            : getRoleLabel()}
        </span>
      </div>

      <StaffStats staff={scopedStaff} loading={loading} error={error} />

      <StaffDirectory
        staff={scopedStaff}
        loading={loading}
        error={error}
        onRetry={reload}
      />
    </div>
  )
}
