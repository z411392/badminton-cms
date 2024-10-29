import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onRemovingMeetup = async (groupId: string, meetupId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/meetups/:meetupId`.replace(":groupId", groupId).replace(":meetupId", meetupId)
    try {
        const {
            data: {
                payload: { meetupId },
            },
        } = await axios.delete<{ payload: { meetupId: string } }>(uri)
        showSuccess(`刪除了球敘 ${meetupId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
