import { useState, type Ref } from 'react'
import { useController, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signup } from '../lib/api'
import {
  DEPARTMENTS,
  normalizeEcNumber,
  normalizePhone,
  signupSchema,
  type SignupValues,
} from '../lib/validation'
import { AlertIcon, CheckIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from './icons'

interface BaseFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
}

function Label({ id, label, required, hint }: BaseFieldProps) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={id} className="label mb-0">
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : null}
      </label>
      {hint ? (
        <span id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="error-text">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </p>
  )
}

interface TextFieldProps extends BaseFieldProps {
  type?: string
  autoComplete?: string
  inputMode?: 'text' | 'tel' | 'numeric'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: Ref<HTMLInputElement>
  autoCapitalize?: string
  autoCorrect?: string
  spellCheck?: boolean
}

function TextField({
  id,
  label,
  error,
  hint,
  required,
  type = 'text',
  autoComplete,
  inputMode,
  placeholder,
  value,
  onChange,
  onBlur,
  inputRef,
  autoCapitalize,
  autoCorrect,
  spellCheck,
}: TextFieldProps) {
  return (
    <div>
      <Label id={id} label={label} hint={hint} required={required} />
      <input
        id={id}
        name={id}
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        spellCheck={spellCheck}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`input ${error ? 'input-invalid' : ''}`}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

interface PasswordFieldProps extends BaseFieldProps {
  autoComplete: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: Ref<HTMLInputElement>
}

function PasswordField({
  id,
  label,
  error,
  hint,
  required,
  autoComplete,
  value,
  onChange,
  onBlur,
  inputRef,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <Label id={id} label={label} hint={hint} required={required} />
      <div className="relative">
        <input
          id={id}
          name={id}
          ref={inputRef}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`input pr-12 ${error ? 'input-invalid' : ''}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-0 top-0 inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl text-slate-500 transition hover:text-primary"
        >
          {visible ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export function SignupForm() {
  const [created, setCreated] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>(undefined)

  const { control, handleSubmit, formState } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      surname: '',
      ecNumber: '',
      phone: '',
      department: '',
      password: '',
      confirmPassword: '',
    },
  })

  const firstName = useController({ name: 'firstName', control })
  const surname = useController({ name: 'surname', control })
  const ecNumber = useController({ name: 'ecNumber', control })
  const phone = useController({ name: 'phone', control })
  const department = useController({ name: 'department', control })
  const password = useController({ name: 'password', control })
  const confirmPassword = useController({ name: 'confirmPassword', control })

  const { errors, isSubmitting } = formState

  const onSubmit = handleSubmit(async (values) => {
    setServerError(undefined)
    try {
      await signup(values)
      setCreated(true)
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      )
    }
  })

  if (created) {
    return (
      <div className="animate-fade-in py-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-slate-900">Account created</h3>
        <p className="mt-2 text-base text-slate-600">
          Account created. Your headmaster will approve it shortly.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          You will be able to log in once your account has been approved.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField
        id="firstName"
        label="First name"
        required
        autoComplete="given-name"
        placeholder="e.g. Bongelwa"
        value={firstName.field.value}
        onChange={firstName.field.onChange}
        onBlur={firstName.field.onBlur}
        inputRef={firstName.field.ref}
        error={errors.firstName?.message}
      />

      <TextField
        id="surname"
        label="Surname"
        required
        autoComplete="family-name"
        placeholder="e.g. Ndlovu"
        value={surname.field.value}
        onChange={surname.field.onChange}
        onBlur={surname.field.onBlur}
        inputRef={surname.field.ref}
        error={errors.surname?.message}
      />

      <TextField
        id="ecNumber"
        label="EC number"
        required
        hint="As shown on your payslip"
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="e.g. EC12345"
        value={ecNumber.field.value}
        onChange={(value) => ecNumber.field.onChange(normalizeEcNumber(value))}
        onBlur={ecNumber.field.onBlur}
        inputRef={ecNumber.field.ref}
        error={errors.ecNumber?.message}
      />

      <TextField
        id="phone"
        label="Phone number / WhatsApp"
        required
        inputMode="tel"
        autoComplete="tel"
        placeholder="e.g. 0771234567"
        value={phone.field.value}
        onChange={(value) => phone.field.onChange(normalizePhone(value))}
        onBlur={phone.field.onBlur}
        inputRef={phone.field.ref}
        error={errors.phone?.message}
      />

      <div>
        <Label id="department" label="Department / Grade taught" />
        <select
          id="department"
          name="department"
          ref={department.field.ref}
          value={department.field.value}
          onChange={department.field.onChange}
          onBlur={department.field.onBlur}
          aria-invalid={errors.department ? true : undefined}
          aria-describedby={errors.department ? 'department-error' : undefined}
          className={`input appearance-none bg-[length:18px] bg-[right_0.9rem_center] bg-no-repeat pr-10 ${
            errors.department ? 'input-invalid' : ''
          }`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
          }}
        >
          <option value="">Select department</option>
          {DEPARTMENTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FieldError id="department-error" message={errors.department?.message} />
      </div>

      <PasswordField
        id="password"
        label="Password"
        required
        hint="At least 8 characters"
        autoComplete="new-password"
        value={password.field.value}
        onChange={password.field.onChange}
        onBlur={password.field.onBlur}
        inputRef={password.field.ref}
        error={errors.password?.message}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        required
        autoComplete="new-password"
        value={confirmPassword.field.value}
        onChange={confirmPassword.field.onChange}
        onBlur={confirmPassword.field.onBlur}
        inputRef={confirmPassword.field.ref}
        error={errors.confirmPassword?.message}
      />

      {serverError ? (
        <p role="alert" className="error-text rounded-xl bg-red-50 px-3 py-2">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? (
          <>
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            Creating account…
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}
