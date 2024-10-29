import { type Playlist } from "~/lib/modules/PlaylistManaging/dtos/Playlist"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"
import { type CountingPlaylists } from "~/lib/modules/PlaylistManaging/presentation/controllers/onCountingPlaylists"
import { isCancel } from "axios"

export type ListingPlaylists = CountingPlaylists & {
    page: number
}

export const onListingPlaylists = async (
    groupId: string,
    { page, search }: ListingPlaylists,
    signal?: AbortController["signal"],
) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/playlists`.replace(":groupId", groupId)
    const params = { page, search }
    try {
        const {
            data: {
                payload: { playlists },
            },
        } = await axios.get<{
            payload: {
                playlists: Playlist[]
            }
        }>(uri, { params })
        return playlists
    } catch (thrown) {
        if (isCancel(thrown)) return []
        const error = translateError(thrown)
        if (error) showError(error.message)
        return []
    }
}
