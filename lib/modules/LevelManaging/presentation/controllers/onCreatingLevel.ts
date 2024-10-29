import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type CreatingLevel = {
    name: string
    order: number
    color: string
    description: string
}

export const onCreatingLevel = async (groupId: string, data: CreatingLevel) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/levels`.replace(":groupId", groupId)
    try {
        const {
            data: {
                payload: { levelId },
            },
        } = await axios.post<{ payload: { levelId: string } }>(uri, data)
        showSuccess(`新增了分級 ${levelId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
