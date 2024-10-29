import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type UpdatingShuttle = {
    brand: string
    name: string
}

export const onUpdatingShuttle = async (shuttleId: string, data: UpdatingShuttle) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/shuttles/:shuttleId".replace(":shuttleId", shuttleId)
    try {
        const {
            data: {
                payload: { shuttleId },
            },
        } = await axios.put<{ payload: { shuttleId: string } }>(uri, data)
        showSuccess(`更新了用球 ${shuttleId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
