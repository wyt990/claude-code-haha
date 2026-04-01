export type FeedbackSurveyType = string

export type FeedbackSurveyResponse = {
  rating?: number
  comment?: string
  [key: string]: unknown
}
