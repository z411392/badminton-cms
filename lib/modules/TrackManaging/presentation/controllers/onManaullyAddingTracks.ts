import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type AddingTracks = {
    spotifyIds: string[]
}

export const onManaullyAddingTracks = async (groupId: string, playlistId: string, data: AddingTracks) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/playlists/:playlistId/tracks`
        .replace(":groupId", groupId)
        .replace(":playlistId", playlistId)
    try {
        const {
            data: {
                payload: { trackIds },
            },
        } = await axios.post<{ payload: { trackIds: string[] } }>(uri, data)
        showSuccess(`新增了點播 ${trackIds.map((trackId) => trackIds).join(", ")}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
