import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"

export type CountingPlaylists = {
    search: string
}

export const onCountingPlaylists = async (groupId: string, { search }: CountingPlaylists) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/playlists`.replace(":groupId", groupId)
    const params = { search }
    try {
        const response = await axios.head(uri, { params })
        const total = parseInt(response.headers["content-length"])
        return total
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
        return 0
    }
}
