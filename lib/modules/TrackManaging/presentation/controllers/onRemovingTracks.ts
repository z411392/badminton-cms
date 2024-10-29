import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onRemovingTracks = async (groupId: string, playlistId: string, trackIds: string[]) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/playlists/:playlistId/tracks`
        .replace(":groupId", groupId)
        .replace(":playlistId", playlistId)
    const data = { trackIds }
    try {
        await axios.delete<{ payload: { trackIds: string[] } }>(uri, { data })
        showSuccess(`刪除了點播 ${trackIds.map((trackId) => trackId).join(", ")}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
