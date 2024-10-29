import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onRemovingProfile = async (groupId: string, profileId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/profiles/:profileId`.replace(":groupId", groupId).replace(":profileId", profileId)
    try {
        const {
            data: {
                payload: { profileId },
            },
        } = await axios.delete<{ payload: { profileId: string } }>(uri)
        showSuccess(`刪除了基本資料 ${profileId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
