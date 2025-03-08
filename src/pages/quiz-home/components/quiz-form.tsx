import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { ROUTES } from '@/lib/constants'
import { handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { useAction } from 'convex/react'
import { ConvexError } from 'convex/values'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useActionState, useId, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  notes: z.string(),
  context: z.string().optional(),
  numQuestions: z.coerce.number(),
  optionsPerQuestion: z.coerce.number(),
})

const OPTIONS_PER_QUESTION = [
  { value: '2', label: '2 Options' },
  { value: '3', label: '3 Options' },
  { value: '4', label: '4 Options' },
  { value: '5', label: '5 Options' },
  { value: '6', label: '6 Options' },
]

type FormState =
  | {
      status: 'error'
      errorMessage: string
    }
  | {
      status: 'success'
    }
  | {
      status: 'init'
    }

export function QuizForm() {
  const id = useId()
  const navigate = useNavigate()
  const [numberOfQuestions, setNumberOfQuestions] = useState(10)

  const createQuiz = useAction(api.quizzes.createQuiz)

  const [, formAction, isPending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const formObj = formSchema.parse(Object.fromEntries(formData))

      const [result, error] = await handlePromise(createQuiz(formObj))

      if (error) {
        if (error instanceof ConvexError) {
          toast.error(error.message)
        } else {
          toast.error('An unknown error occurred')
        }
        return { status: 'error', errorMessage: error.message }
      }

      void navigate(generatePath(ROUTES.quizDetail, { quizId: result.quizId }))
      return { status: 'success' }
    },
    { status: 'init' }
  )

  return (
    <form className="flex flex-col gap-12" action={formAction}>
      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Your Study Notes
        </label>
        <Textarea
          id="notes"
          placeholder="Paste your study notes here..."
          name="notes"
          className="min-h-[200px] resize-none"
          onKeyDown={(event) => {
            // pressing cmd/ctrl + enter
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault()
              // dispatch a submit event
              event.currentTarget.form?.dispatchEvent(
                // bubbles so it can be caught by the form
                // cancelable so it can be cancelled - since our form calls event.preventDefault()
                new Event('submit', { bubbles: true, cancelable: true })
              )
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="context" className="text-sm font-medium">
          Additional Context (Optional)
        </label>
        <Input
          id="context"
          placeholder="E.g., Lecture name, book title, or specific topic"
          name="context"
        />
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Number of Questions:{' '}
            <span className="font-bold">{numberOfQuestions}</span>
          </label>
          <Slider
            value={[numberOfQuestions]}
            onValueChange={(value) => setNumberOfQuestions(value[0])}
            min={5}
            max={20}
            step={1}
            name="numQuestions"
            className="mt-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Options per Question</legend>
          <RadioGroup
            className="grid grid-cols-3 gap-2"
            defaultValue="4"
            name="optionsPerQuestion"
          >
            {OPTIONS_PER_QUESTION.map((item) => (
              <label
                key={`${id}-${item.value}`}
                className="border-input has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10 relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-2 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors"
              >
                <RadioGroupItem
                  id={`${id}-${item.value}`}
                  value={item.value}
                  className="sr-only after:absolute after:inset-0"
                />
                <p className="text-foreground text-sm leading-none font-medium">
                  {item.label}
                </p>
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
          disabled={isPending}
        >
          Generate Quiz
          {isPending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  )
}
