import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type CreatingTag = {
    name: string
}

export const onCreatingTag = async (groupId: string, data: CreatingTag) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/tags`.replace(":groupId", groupId)
    try {
        const {
            data: {
                payload: { tagId },
            },
        } = await axios.post<{ payload: { tagId: string } }>(uri, data)
        showSuccess(`新增了標籤 ${tagId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
