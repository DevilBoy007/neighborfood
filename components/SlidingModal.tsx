import { Modal } from 'react-native';

<Modal
    animated
    animationType="fade"
    visible={this.props.visible}
    transparent
    onRequestClose={() => this._handleDismiss()}>
    <View style={styles.overlay}>
        ...
    </View>
</Modal>
const styles = StyleSheet.create({
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        flex: 1,
        justifyContent: 'flex-end',
    },
});