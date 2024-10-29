import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"
import { type SignUpStatuses } from "~/lib/modules/SignUpManaging/dtos/SignUpStatuses"

export type ReviewingSignUp = {
    status: SignUpStatuses
}

export const onReviewingSignUp = async (
    groupId: string,
    meetupId: string,
    timeslotId: string,
    signUpId: string,
    data: ReviewingSignUp,
) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/meetups/:meetupId/timeslots/:timeslotId/signUps/:signUpId`
        .replace(":groupId", groupId)
        .replace(":meetupId", meetupId)
        .replace(":timeslotId", timeslotId)
        .replace(":signUpId", signUpId)
    try {
        const {
            data: {
                payload: { signUpId },
            },
        } = await axios.put<{
            payload: {
                signUpId: string
            }
        }>(uri, data)
        showSuccess(`更新了報名狀態 ${signUpId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
