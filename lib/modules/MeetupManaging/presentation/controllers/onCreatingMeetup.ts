import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"
import { type Timeslot } from "~/lib/modules/MeetupManaging/dtos/Timeslot"

export type CreatingMeetup = {
    name: string
    date: string
    description: string
    venueId: string
    shuttleIds: string[]
    playlistId?: string
    timeslots: Omit<Timeslot, "id">[]
}

export const onCreatingMeetup = async (groupId: string, data: CreatingMeetup) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/meetups`.replace(":groupId", groupId)
    try {
        const {
            data: {
                payload: { meetupId },
            },
        } = await axios.post<{ payload: { meetupId: string } }>(uri, data)
        showSuccess(`新增了球敘 ${meetupId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
