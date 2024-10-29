import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onRemovingTag = async (groupId: string, tagId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/tags/:tagId`.replace(":groupId", groupId).replace(":tagId", tagId)
    try {
        const {
            data: {
                payload: { tagId },
            },
        } = await axios.delete<{ payload: { tagId: string } }>(uri)
        showSuccess(`刪除了標籤 ${tagId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
