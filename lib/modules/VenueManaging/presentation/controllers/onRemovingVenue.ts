import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export const onRemovingVenue = async (venueId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/venues/:venueId".replace(":venueId", venueId)
    try {
        const {
            data: {
                payload: { venueId },
            },
        } = await axios.delete<{ payload: { venueId: string } }>(uri)
        showSuccess(`刪除了場地 ${venueId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
