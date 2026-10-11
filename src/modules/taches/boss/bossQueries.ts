import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { parisDay } from '../../../core'
import { isCurrentBoss } from '../rules/boss'
import { summarizeAward } from '../rules/xp'
import { TASKS_KEY, useTasks, type Task } from '../tasks/taskQueries'
import { invalidateProgress } from '../xp/xpQueries'
import { toggleBossStep } from './bossAwards'

/** Boss de la semaine en cours (un boss d'une semaine passée s'est échappé : il n'apparaît plus). */
export function useBoss() {
  const query = useTasks()
  const today = parisDay()
  const boss = query.data?.find((t) => t.is_boss && isCurrentBoss(t.boss_week, today)) ?? null
  return { boss, isPending: query.isPending, isError: query.isError }
}

/** Coche / décoche une étape du boss (mise à jour immédiate) ; l'écran de récompense s'ouvre à la victoire ou au niveau gagné. */
export function useToggleBossStep() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: ({ task, stepId, done }: { task: Task; stepId: string; done: boolean }) =>
      toggleBossStep(task, stepId, done),
    onMutate: async ({ stepId, done }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY)
      queryClient.setQueryData<Task[]>(TASKS_KEY, (tasks) =>
        tasks?.map((t) => ({
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === stepId ? { ...s, done_at: done ? new Date().toISOString() : null } : s
          ),
        }))
      )
      return { previous }
    },
    onSuccess: (award) => {
      if (
        award &&
        (award.kind === 'boss' || summarizeAward(award).levelUp || (award.badges?.length ?? 0) > 0)
      )
        navigate('/taches/recompense', { state: { award } })
    },
    onError: (_e, _v, context) => queryClient.setQueryData(TASKS_KEY, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      invalidateProgress(queryClient)
    },
  })
}
