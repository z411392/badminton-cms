import { type Meetup } from "~/lib/modules/MeetupManaging/dtos/Meetup"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"
import { type CountingMeetups } from "~/lib/modules/MeetupManaging/presentation/controllers/onCountingMeetups"
import { type Venue } from "~/lib/modules/VenueManaging/dtos/Venue"
import { type Shuttle } from "~/lib/modules/ShuttleManaging/dtos/Shuttle"
import { type Playlist } from "~/lib/modules/PlaylistManaging/dtos/Playlist"

export type ListingMeetups = CountingMeetups & {
    page: number
}

export type MeetupEnriched = Meetup & {
    venue: Venue
    shuttles: Shuttle[]
    playlist?: Playlist
}

export const onListingMeetups = async (groupId: string, { page, search }: ListingMeetups) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/meetups`.replace(":groupId", groupId)
    const params = { page, search }
    try {
        const {
            data: {
                payload: { meetups, venuesMap, shuttlesMap, playlistsMap },
            },
        } = await axios.get<{
            payload: {
                meetups: Meetup[]
                venuesMap: { [venueId: string]: Venue }
                shuttlesMap: { [shuttleId: string]: Shuttle }
                playlistsMap: { [playlistId: string]: Playlist }
            }
        }>(uri, { params })
        return meetups.map(({ venueId, shuttleIds, playlistId, ...rest }: Meetup) => {
            const venue = venuesMap[venueId]
            const shuttles = shuttleIds.map((shuttleId) => shuttlesMap[shuttleId]).filter((shuttle) => !!shuttle)
            const playlist = playlistId ? playlistsMap[playlistId] : undefined
            const meetup: MeetupEnriched = {
                ...rest,
                venueId,
                shuttleIds,
                venue,
                shuttles,
                playlist,
            }
            return meetup
        })
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
        return []
    }
}
