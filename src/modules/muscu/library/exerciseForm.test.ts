import { describe, expect, it } from 'vitest'
import { isUploadedImage, toExerciseValues, type ExerciseForm } from './exerciseForm'

const form: ExerciseForm = {
  name: '  Développé couché  ',
  primary: 'pecs',
  secondary: ['triceps', 'pecs', 'epaules'],
  equipment: 'barre',
  tracking: 'poids_reps',
  instructions: '   ',
}

describe('toExerciseValues', () => {
  it('nettoie le nom, retire le groupe principal des secondaires et vide les consignes blanches', () => {
    expect(toExerciseValues(form)).toEqual({
      name: 'Développé couché',
      primary_group: 'pecs',
      secondary_groups: ['triceps', 'epaules'],
      equipment: 'barre',
      tracking: 'poids_reps',
      instructions: null,
    })
  })
  it('refuse un nom vide', () => {
    expect(toExerciseValues({ ...form, name: '   ' })).toBeNull()
  })
})

describe('isUploadedImage', () => {
  it('reconnaît un chemin Storage <user_id>/…', () => {
    expect(isUploadedImage('0b1f2c3d-1111-4222-8333-444455556666/abc.jpg')).toBe(true)
  })
  it('rejette les images de base et null', () => {
    expect(isUploadedImage('Barbell_Curl/0.jpg')).toBe(false)
    expect(isUploadedImage(null)).toBe(false)
  })
})
