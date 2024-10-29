import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type CreatingShuttle = {
    brand: string
    name: string
}

export const onCreatingShuttle = async (data: CreatingShuttle) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/shuttles"
    try {
        const {
            data: {
                payload: { shuttleId },
            },
        } = await axios.post<{ payload: { shuttleId: string } }>(uri, data)
        showSuccess(`新增了用球 ${shuttleId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
