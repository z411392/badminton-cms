import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type CreatingPlaylist = {
    name: string
}

export const onCreatingPlaylist = async (groupId: string, data: CreatingPlaylist) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/playlists`.replace(":groupId", groupId)
    try {
        const {
            data: {
                payload: { playlistId },
            },
        } = await axios.post<{ payload: { playlistId: string } }>(uri, data)
        showSuccess(`新增了播放清單 ${playlistId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
