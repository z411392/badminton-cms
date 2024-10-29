import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"
import { type Plan } from "~/lib/modules/MeetupManaging/dtos/Plan"

export type UpdatingMeetup = {
    name: string
    date: string
    description: string
    venueId: string
    shuttleIds: string[]
    playlistId?: string
    plans: Plan[]
}

export const onUpdatingMeetup = async (groupId: string, meetupId: string, data: UpdatingMeetup) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/meetups/:meetupId`.replace(":groupId", groupId).replace(":meetupId", meetupId)
    try {
        const {
            data: {
                payload: { meetupId },
            },
        } = await axios.put<{ payload: { meetupId: string } }>(uri, data)
        showSuccess(`更新了球敘 ${meetupId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
