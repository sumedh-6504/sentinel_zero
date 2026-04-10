import { z } from 'zod';

export const CreateScanSchema = z.object({
    body: z.object({
        github_url: z.url(),
        full_name: z.string().min(3)
    })
})

export type CreateScanInput = z.infer<typeof CreateScanSchema>['body']