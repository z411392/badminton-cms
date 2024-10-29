import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type UpdatingPlaylist = {
    name: string
}

export const onUpdatingPlaylist = async (groupId: string, playlistId: string, data: UpdatingPlaylist) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/playlists/:playlistId`.replace(":groupId", groupId).replace(":playlistId", playlistId)
    try {
        const {
            data: {
                payload: { playlistId },
            },
        } = await axios.put<{ payload: { playlistId: string } }>(uri, data)
        showSuccess(`更新了播放清單 ${playlistId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
