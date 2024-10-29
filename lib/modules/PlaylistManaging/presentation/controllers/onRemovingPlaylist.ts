import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onRemovingPlaylist = async (groupId: string, playlistId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/playlists/:playlistId`.replace(":groupId", groupId).replace(":playlistId", playlistId)
    try {
        const {
            data: {
                payload: { playlistId },
            },
        } = await axios.delete<{ payload: { playlistId: string } }>(uri)
        showSuccess(`刪除了播放清單 ${playlistId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
