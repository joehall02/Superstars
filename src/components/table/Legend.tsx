import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { IconButton, Popover } from '@mui/material';
import { type MouseEvent, useState } from 'react';

import { useScreenDetection } from '../../hooks/theme';
import { type LegendEntry } from '../../types/config.types';
import { useLegendStyles } from '../styles';

interface ILegendProps {
	entries: LegendEntry[];
}

/**
 * Mobile-only key that decodes a table's abbreviated column headers. An info button opens a
 * popover listing each abbreviation (with its game icon, when present) against the full
 * description — the touch fallback for the desktop hover tooltips, which have no equivalent.
 */
export const Legend = ({ entries }: ILegendProps) => {
	const { isMobile } = useScreenDetection();
	const { classes } = useLegendStyles();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	if (!isMobile || entries.length === 0) {
		return null;
	}

	const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);

	return (
		<>
			<IconButton size='small' aria-label='Column key' className={classes.button} onClick={handleOpen}>
				<InfoOutlinedIcon fontSize='small' />
			</IconButton>
			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<dl className={classes.list}>
					{entries.map((entry) => (
						<div key={`${entry.abbreviation}-${entry.description}`} className={classes.row}>
							<dt className={classes.term}>
								{entry.icon && <img className={classes.icon} src={entry.icon} alt='' />}
								{entry.abbreviation}
							</dt>
							<dd className={classes.description}>{entry.description}</dd>
						</div>
					))}
				</dl>
			</Popover>
		</>
	);
};
