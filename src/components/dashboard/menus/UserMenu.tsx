import { IconButton, Avatar, Menu, MenuItem, Typography, Divider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import type { User } from 'firebase/auth';

interface UserMenuProps {
  user: User | null;
  open: boolean;
  anchorEl: HTMLElement | null;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onCloseMenu: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  size?: 'small' | 'medium';
  showBorder?: boolean;
}

export const UserMenu = ({
  user,
  open,
  anchorEl,
  onOpenMenu,
  onCloseMenu,
  onOpenSettings,
  onLogout,
  size = 'small',
  showBorder = false,
}: UserMenuProps) => {
  const handleSettingsClick = () => {
    onOpenSettings();
    onCloseMenu();
  };

  return (
    <>
      <IconButton
        onClick={onOpenMenu}
        size={size}
        sx={showBorder ? {
          border: '2px solid rgba(255, 255, 255, 0.3)',
          '&:hover': {
            border: '2px solid rgba(255, 255, 255, 0.5)',
          }
        } : undefined}
      >
        <Avatar src={user?.photoURL || ''} sx={{ width: 28, height: 28 }}>
          {user?.displayName?.[0]}
        </Avatar>
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={onCloseMenu}>
        <MenuItem disabled>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {user?.displayName}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSettingsClick}>
          <SettingsIcon sx={{ mr: 1, fontSize: 18 }} /> Gestionar Categorías
        </MenuItem>
        <MenuItem onClick={onLogout}>
          <LogoutIcon sx={{ mr: 1, fontSize: 18 }} /> Cerrar Sesión
        </MenuItem>
      </Menu>
    </>
  );
};
