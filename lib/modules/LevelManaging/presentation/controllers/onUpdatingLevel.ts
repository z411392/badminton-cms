import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type UpdatingLevel = {
    name: string
    order: number
    color: string
    description: string
}

export const onUpdatingLevel = async (groupId: string, levelId: string, data: UpdatingLevel) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/levels/:levelId`.replace(":groupId", groupId).replace(":levelId", levelId)
    try {
        const {
            data: {
                payload: { levelId },
            },
        } = await axios.put<{ payload: { levelId: string } }>(uri, data)
        showSuccess(`更新了分級 ${levelId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
