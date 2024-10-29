import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onRemovingLevel = async (groupId: string, levelId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/levels/:levelId`.replace(":groupId", groupId).replace(":levelId", levelId)
    try {
        const {
            data: {
                payload: { levelId },
            },
        } = await axios.delete<{ payload: { levelId: string } }>(uri)
        showSuccess(`刪除了分級 ${levelId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
