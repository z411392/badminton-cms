import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onJoiningGroup = async (groupId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/groups/:groupId/permissions".replace(":groupId", groupId)
    const data = {}
    try {
        const {
            data: {
                payload: { permissionId: _ },
            },
        } = await axios.post<{ payload: { permissionId: string } }>(uri, data)
        showSuccess(`已向球隊提出加入申請`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
