import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { waitlistSchema, type WaitlistFormData } from '@universe/validation'
import { UNIVERSITIES, UNIVERSITY_ACADEMICS, GRADUATION_YEARS } from '@universe/constants'
import { Button, Input, Select, Label } from '@universe/ui'
import { useWaitlistSubmit } from '../hooks/useWaitlistSubmit'

const OTHER_VALUE = '__OTHER__'

export function WaitlistForm() {
  const { submit, isSubmitting, isSuccess } = useWaitlistSubmit()

  // Guided selection state — separate from react-hook-form to drive UI logic
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [selectedFaculty, setSelectedFaculty] = useState('')

  // "Other" free-text mode toggles
  const [isFacultyOther, setIsFacultyOther] = useState(false)
  const [isDeptOther, setIsDeptOther] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      referral_code: new URLSearchParams(window.location.search).get('ref') || undefined,
    },
  })

  const watchedUniversity = watch('university')

  // Derive the faculties available for the selected university
  const faculties = UNIVERSITY_ACADEMICS[selectedUniversity] ?? []

  // Derive the departments available for the selected faculty
  const departments =
    faculties.find((f) => f.name === selectedFaculty)?.departments ?? []

  // When university changes, reset downstream selections
  useEffect(() => {
    setSelectedFaculty('')
    setIsFacultyOther(false)
    setIsDeptOther(false)
    setValue('faculty', undefined)
    setValue('department', undefined)
  }, [watchedUniversity, setValue])

  // When faculty changes, reset department selection
  useEffect(() => {
    setIsDeptOther(false)
    setValue('department', undefined)
  }, [selectedFaculty, setValue])

  const handleFacultySelect = (value: string) => {
    if (value === OTHER_VALUE) {
      setIsFacultyOther(true)
      setSelectedFaculty('')
      setValue('faculty', '')
      setValue('department', undefined)
    } else {
      setIsFacultyOther(false)
      setSelectedFaculty(value)
      setValue('faculty', value)
      setValue('department', undefined)
    }
    setIsDeptOther(false)
  }

  const handleDeptSelect = (value: string) => {
    if (value === OTHER_VALUE) {
      setIsDeptOther(true)
      setValue('department', '')
    } else {
      setIsDeptOther(false)
      setValue('department', value)
    }
  }

  const onSubmit = async (data: WaitlistFormData) => {
    await submit(data)
  }

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-2xl">
          💌
        </div>
        <h3 className="mb-2 text-lg font-bold text-primary-900">Check your inbox</h3>
        <p className="text-sm text-primary-700">
          We've sent a magic link to your email address. Click it to verify your account and view your waitlist position.
        </p>
      </div>
    )
  }

  const hasUniversityData = selectedUniversity && faculties.length > 0
  const showDepartmentSection =
    hasUniversityData && (selectedFaculty || isFacultyOther)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-1.5 text-left">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          placeholder="Tobi Adeyemi"
          error={!!errors.full_name}
          {...register('full_name')}
        />
        {errors.full_name && (
          <p className="text-xs text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5 text-left">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="tobi@example.com"
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* University */}
      <div className="space-y-1.5 text-left">
        <Label htmlFor="university">University</Label>
        <Select
          id="university"
          error={!!errors.university}
          {...register('university', {
            onChange: (e) => setSelectedUniversity(e.target.value),
          })}
        >
          <option value="">Select your university...</option>
          {UNIVERSITIES.map((uni) => (
            <option key={uni} value={uni}>
              {uni}
            </option>
          ))}
        </Select>
        {errors.university && (
          <p className="text-xs text-red-600">{errors.university.message}</p>
        )}
      </div>

      {/* Faculty — only shown when the selected university has data */}
      {hasUniversityData && (
        <div className="space-y-1.5 text-left">
          <Label htmlFor="faculty_select">Faculty</Label>
          {!isFacultyOther ? (
            <Select
              id="faculty_select"
              defaultValue=""
              onChange={(e) => handleFacultySelect(e.target.value)}
            >
              <option value="">Select your faculty...</option>
              {faculties.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
              <option value={OTHER_VALUE}>Other (not listed)</option>
            </Select>
          ) : (
            <div className="space-y-2">
              <Input
                id="faculty_input"
                placeholder="e.g. Faculty of Agriculture"
                error={!!errors.faculty}
                {...register('faculty')}
              />
              <button
                type="button"
                className="text-xs text-primary-600 hover:underline"
                onClick={() => {
                  setIsFacultyOther(false)
                  setValue('faculty', undefined)
                }}
              >
                ← Back to list
              </button>
            </div>
          )}
          {errors.faculty && (
            <p className="text-xs text-red-600">{errors.faculty.message}</p>
          )}
        </div>
      )}

      {/* Department — only shown once a faculty is chosen */}
      {showDepartmentSection && !isFacultyOther && departments.length > 0 && (
        <div className="space-y-1.5 text-left">
          <Label htmlFor="department_select">Department</Label>
          {!isDeptOther ? (
            <Select
              id="department_select"
              defaultValue=""
              onChange={(e) => handleDeptSelect(e.target.value)}
            >
              <option value="">Select your department...</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value={OTHER_VALUE}>Other (not listed)</option>
            </Select>
          ) : (
            <div className="space-y-2">
              <Input
                id="department_input"
                placeholder="e.g. Agricultural Extension"
                error={!!errors.department}
                {...register('department')}
              />
              <button
                type="button"
                className="text-xs text-primary-600 hover:underline"
                onClick={() => {
                  setIsDeptOther(false)
                  setValue('department', undefined)
                }}
              >
                ← Back to list
              </button>
            </div>
          )}
          {errors.department && (
            <p className="text-xs text-red-600">{errors.department.message}</p>
          )}
        </div>
      )}

      {/* Phone Number (Optional) */}
      <div className="space-y-1.5 text-left">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+234..."
          error={!!errors.phone}
          {...register('phone')}
        />
        {errors.phone && (
          <p className="text-xs text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Expected Graduation Year (Optional) */}
      <div className="space-y-1.5 text-left">
        <Label htmlFor="graduation_year">Expected Graduation Year (Optional)</Label>
        <Select
          id="graduation_year"
          error={!!errors.graduation_year}
          {...register('graduation_year')}
        >
          <option value="">Select year...</option>
          {GRADUATION_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
        {errors.graduation_year && (
          <p className="text-xs text-red-600">{errors.graduation_year.message}</p>
        )}
      </div>

      {/* Terms & Newsletter */}
      <div className="space-y-3 pt-2 text-left">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
            {...register('terms_accepted')}
          />
          <span className="text-sm text-zinc-700">
            I agree to the <a href="/terms" className="text-primary-600 hover:underline" target="_blank">Terms of Service</a> and <a href="/privacy" className="text-primary-600 hover:underline" target="_blank">Privacy Policy</a>.
          </span>
        </label>
        {errors.terms_accepted && (
          <p className="text-xs text-red-600 ml-7">{errors.terms_accepted.message}</p>
        )}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
            {...register('newsletter_consent')}
          />
          <span className="text-sm text-zinc-700">
            Keep me updated about launch, new features, and beta testing opportunities.
          </span>
        </label>
      </div>

      {/* Hidden referral code */}
      <input type="hidden" {...register('referral_code')} />

      <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
        {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
      </Button>
    </form>
  )
}
