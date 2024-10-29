import { SessionKeys } from "~/lib/utils/sessions"
import { type Meetup } from "~/lib/modules/MeetupManaging/dtos/Meetup"
import { onRetrievingMeetup } from "~/lib/modules/MeetupManaging/presentation/controllers/onRetrievingMeetup"

export const withMeetupResolving = async (groupId: string, meetupId: string) => {
    const { data } = useNuxtData(SessionKeys.Meetup) as { data: Ref<Meetup> }
    const meetup = await onRetrievingMeetup(groupId, meetupId)
    if (!meetup) return
    data.value = meetup
}
