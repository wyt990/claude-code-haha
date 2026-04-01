export type FeedbackSurveyType = string

/** Survey UI uses string ratings; analytics may attach richer objects. */
export type FeedbackSurveyResponse =
  | 'dismissed'
  | 'bad'
  | 'fine'
  | 'good'
  | {
      rating?: number
      comment?: string
      [key: string]: unknown
    }
