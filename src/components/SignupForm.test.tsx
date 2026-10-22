import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from './SignupForm'

const input = (label: RegExp) => screen.getByLabelText(label, { selector: 'input' })
const select = (label: RegExp) => screen.getByLabelText(label, { selector: 'select' })
const submit = () => screen.getByRole('button', { name: /create account/i })

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(input(/first name/i), 'Talent')
  await user.type(input(/surname/i), 'Moyo')
  await user.type(input(/ec number/i), 'EC12345')
  await user.type(input(/phone number/i), '0771234567')
  await user.selectOptions(select(/department/i), 'Grade 3')
  await user.type(input(/^password/i), 'password1')
  await user.type(input(/confirm password/i), 'password1')
}

describe('SignupForm', () => {
  it('shows plain language errors for an empty submit', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.click(submit())

    expect(await screen.findByText('Enter your first name')).toBeInTheDocument()
    expect(screen.getByText('Enter your surname')).toBeInTheDocument()
    expect(screen.getByText('Enter your EC number')).toBeInTheDocument()
    expect(screen.getByText('Enter your phone number')).toBeInTheDocument()
    expect(screen.getByText('Confirm your password')).toBeInTheDocument()
  })

  it('rejects a phone number that is not in Zimbabwe format', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(input(/phone number/i), '12345')
    await user.click(submit())

    expect(
      await screen.findByText('Enter a valid number, for example 0771234567'),
    ).toBeInTheDocument()
  })

  it('warns when the passwords do not match', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(input(/^password/i), 'password1')
    await user.type(input(/confirm password/i), 'password2')
    await user.click(submit())

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })

  it('normalises the EC number and shows the success message', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)

    await fillValidForm(user)
    await user.click(submit())

    await waitFor(
      () => {
        expect(
          screen.getByText(/your headmaster will approve it shortly/i),
        ).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })
})
