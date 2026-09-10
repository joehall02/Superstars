import CloseIcon from '@mui/icons-material/Close';
import { Divider, IconButton, Paper, Skeleton, Typography } from '@mui/material';

import { PageNames } from '../enums/pages';
import { usePageLocalisation, usePlayerIcon } from '../hooks/config';
import { useCachedImage } from '../hooks/image';
import { useAllGames, useAllTimeRankings, usePlayer } from '../services/masterScores/useMasterScores';
import { useProfileCardStyles } from './styles';

interface IProfileCardProps {
	playerId: string;
	/** When provided (mobile drawer), renders a dismiss button that calls this. */
	onClose?: () => void;
}

/**
 * Player profile: icon, name, overall all-time rank & score, then the player's rank in
 * every game (null → em dash). Self-fetches by `playerId` from the cached dataset, so it
 * can be dropped into the Rankings side panel or the mobile drawer without prop drilling.
 * The avatar shares its cached image with the table icon via {@link useCachedImage}, so a
 * plain `<img>` shows nothing (rather than an empty MUI `Avatar`) when the player has no
 * icon or the fetch fails.
 */
export const ProfileCard = ({ playerId, onClose }: IProfileCardProps) => {
	const { classes } = useProfileCardStyles();
	const page = usePageLocalisation(PageNames.Rankings);
	const { data: player, isLoading: playerLoading } = usePlayer(playerId);
	const { data: rankings = [], isLoading: rankingsLoading } = useAllTimeRankings();
	const { data: games = [] } = useAllGames();
	const avatarUrl = useCachedImage(usePlayerIcon(playerId));

	const ranking = rankings.find((row) => row.playerId === playerId);
	const isLoading = playerLoading || rankingsLoading;

	return (
		<Paper className={classes.card}>
			{onClose && (
				<IconButton aria-label='Close profile' className={classes.closeButton} onClick={onClose} size='small'>
					<CloseIcon fontSize='small' />
				</IconButton>
			)}
			<div className={classes.header}>
				{isLoading ? (
					<Skeleton variant='circular' width={56} height={56} className={classes.skeleton} />
				) : (
					avatarUrl && <img className={classes.avatar} src={avatarUrl} alt='' />
				)}
				<Typography variant='h5' className={classes.name}>
					{isLoading ? <Skeleton width={140} className={classes.skeleton} /> : player?.name}
				</Typography>
			</div>
			<div className={classes.overall}>
				{isLoading ? (
					<Skeleton width={120} className={classes.skeleton} />
				) : (
					<>
						<Typography variant='subtitle1'>{page?.overall}</Typography>
						<Typography variant='subtitle1'>#{ranking?.rank ?? '—'}</Typography>
						<Typography variant='body2' className={classes.muted}>· {ranking?.score ?? '—'}</Typography>
					</>
				)}
			</div>
			<Divider className={classes.divider} />
			<div className={classes.gameList}>
				{isLoading
					? Array.from({ length: 6 }, (_, index) => (
						<div key={index} className={classes.gameRow}>
							<Skeleton width={120} className={classes.skeleton} />
							<Skeleton width={24} className={classes.skeleton} />
						</div>
					))
					: games.map((game) => (
						<div key={game.id} className={classes.gameRow}>
							<Typography variant='body2'>{game.name}</Typography>
							<Typography variant='body2'>{ranking?.gameRanks[game.id] ?? '—'}</Typography>
						</div>
					))}
			</div>
		</Paper>
	);
};
