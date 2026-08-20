import { authRouter } from "../features/auth/router";
import { flagsRouter } from "../features/flags/router";
import { resumeRouter } from "../features/resume/router";
import { statisticsRouter } from "../features/statistics/router";
import { storageRouter } from "../features/storage/router";

export default {
	auth: authRouter,
	flags: flagsRouter,
	resume: resumeRouter,
	statistics: statisticsRouter,
	storage: storageRouter,
};
