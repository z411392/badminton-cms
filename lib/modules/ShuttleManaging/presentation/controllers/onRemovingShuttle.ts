import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onRemovingShuttle = async (shuttleId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/shuttles/:shuttleId".replace(":shuttleId", shuttleId)
    try {
        const {
            data: {
                payload: { shuttleId },
            },
        } = await axios.delete<{ payload: { shuttleId: string } }>(uri)
        showSuccess(`刪除了用球 ${shuttleId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
